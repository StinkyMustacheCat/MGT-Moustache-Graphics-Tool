// SPDX-License-Identifier: GPL-3.0-or-later
using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using System.Drawing;
using System.Reflection;
using System.Text;
[assembly: AssemblyTitle("Moustache Graphics Tool")]
[assembly: AssemblyProduct("Moustache Graphics Tool")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

class MGT {
  delegate bool EnumWindowsProc(IntPtr window, IntPtr parameter);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr window);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr window,StringBuilder text,int count);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern IntPtr LoadImage(IntPtr instance,string file,uint type,int width,int height,uint flags);
  [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr icon);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern IntPtr SendMessage(IntPtr window, uint message, IntPtr wparam, IntPtr lparam);
  static string Quote(string value) { return "\""+value.Replace("\"", "\\\"")+"\""; }
  static void ApplyIcon(string[] args) {
    int pid=Int32.Parse(args[1]); using(Process browser=Process.GetProcessById(pid)) {
      IntPtr large=LoadImage(IntPtr.Zero,args[2],1,64,64,0x10),small=LoadImage(IntPtr.Zero,args[2],1,32,32,0x10);
      if(large==IntPtr.Zero||small==IntPtr.Zero)throw new Exception("No se pudo cargar el icono de ventana.");
      try {
      for(int i=0;i<40&&!browser.HasExited;i++) {
        bool found=false;
        EnumWindows(delegate(IntPtr window, IntPtr unused){uint owner;GetWindowThreadProcessId(window,out owner);
          if(owner!=(uint)pid||!IsWindowVisible(window))return true;
          StringBuilder title=new StringBuilder(256);GetWindowText(window,title,title.Capacity);
          if(title.ToString().StartsWith("MGT")) {
            SendMessage(window,0x80,new IntPtr(1),large);SendMessage(window,0x80,IntPtr.Zero,small);
            found=true;
          }return true;
        },IntPtr.Zero);
        if(found) {browser.WaitForExit();return;} Thread.Sleep(250);
      }
      }finally{DestroyIcon(large);DestroyIcon(small);}
    }
  }
  [STAThread] static void Main(string[] args) {
    try {
      if(args.Length==3&&args[0]=="--window-icon") {ApplyIcon(args);return;}
      string root=AppDomain.CurrentDomain.BaseDirectory,node=Path.Combine(root,"runtime","node","node.exe");
      if(!File.Exists(node))throw new Exception("Extrae el ZIP completo de MGT antes de abrirlo.");
      ProcessStartInfo start=new ProcessStartInfo(node,Quote(Path.Combine(root,"launcher.cjs"))) {WorkingDirectory=root,UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden,RedirectStandardError=true,RedirectStandardOutput=true};
      using(Process launcher=Process.Start(start)) {
        launcher.BeginOutputReadLine();string error=launcher.StandardError.ReadToEnd();launcher.WaitForExit();
        if(launcher.ExitCode!=0)throw new Exception(String.IsNullOrWhiteSpace(error)?"No se pudo abrir MGT. Consulta los registros de inicio.":error);
      }
    }catch(Exception error){Console.Error.WriteLine(error.ToString());if(args.Length==0)MessageBox.Show(error.Message,"MGT · No se pudo abrir",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  }
}



